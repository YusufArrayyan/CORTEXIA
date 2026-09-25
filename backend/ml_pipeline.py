import json, re
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import StratifiedGroupKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score,f1_score,confusion_matrix

DATA=Path('/app/assets/dataset/ETDD70_v2')
MODELS=Path(__file__).parent/'models'/'research'
TRIAL=['n_fix_trial','sum_fix_dur_trial','dwell_time_trial','mean_fix_dur_trial','n_sacc_trial','mean_sacc_dur_trial','mean_sacc_ampl_trial','n_between_line_regress_trial','n_within_line_regress_trial','n_regress_trial','n_progress_trial']
ROI=['dwell_time_aoi','n_fix_aoi','mean_fix_dur_aoi','skipped_aoi','n_revisits_aoi']
def dataset_frame():
    labels=pd.read_csv(DATA/'dyslexia_class_label.csv').set_index('subject_id')['class_id'].to_dict();rows=[]
    for path in sorted((DATA/'data'/'data').glob('*_metrics.csv')):
        f=pd.read_csv(path);sid=int(f.iloc[0]['sid']);row={c:float(f.iloc[0][c]) for c in TRIAL};words=f[f['aoi_kind']=='subline']
        row.update({f'avg_{c}':float(words[c].mean()) for c in ROI});row.update({'subject_id':str(sid),'task':f.iloc[0]['task'],'label':int(labels[sid])});rows.append(row)
    return pd.DataFrame(rows).replace([np.inf,-np.inf],np.nan)

def train(algorithm='logistic',import_frame=None,output_dir=None):
    frame=import_frame if import_frame is not None else dataset_frame()
    features=[c for c in frame.columns if c not in ['subject_id','task','label']]
    X=frame[features].astype(float);y=frame['label'].astype(int);groups=frame['subject_id'].astype(str)
    cv=list(StratifiedGroupKFold(n_splits=5,shuffle=True,random_state=42).split(X,y,groups))
    estimator=RandomForestClassifier(n_estimators=160,max_depth=5,min_samples_leaf=3,random_state=42,n_jobs=2,class_weight='balanced') if algorithm=='forest' else LogisticRegression(max_iter=3000,C=0.1,class_weight='balanced',random_state=42)
    model=make_pipeline(SimpleImputer(strategy='median'),StandardScaler(),estimator)
    predictions=cross_val_predict(model,X,y,cv=cv,method='predict')
    probabilities=cross_val_predict(model,X,y,cv=cv,method='predict_proba')[:,1]
    baseline=cross_val_predict(DummyClassifier(strategy='most_frequent'),X,y,cv=cv)
    fold_scores=[{'fold':i+1,'train_participants':len(set(groups.iloc[tr])),'test_participants':len(set(groups.iloc[te])),'overlap':len(set(groups.iloc[tr])&set(groups.iloc[te])),'macro_f1':round(f1_score(y.iloc[te],predictions[te],average='macro'),4)} for i,(tr,te) in enumerate(cv)]
    model.fit(X,y)
    importance=np.abs(estimator.coef_[0]) if algorithm!='forest' else estimator.feature_importances_
    version=datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    report={'id':version+'-'+algorithm,'algorithm':algorithm,'model_name':'Random Forest' if algorithm=='forest' else 'Logistic Regression','version':version,'created_at':datetime.now(timezone.utc).isoformat(),'samples':len(frame),'participants':int(groups.nunique()),'features':features,'accuracy':round(accuracy_score(y,predictions),4),'macro_f1':round(f1_score(y,predictions,average='macro'),4),'baseline_macro_f1':round(f1_score(y,baseline,average='macro'),4),'baseline_accuracy':round(accuracy_score(y,baseline),4),'confusion_matrix':confusion_matrix(y,predictions,labels=[0,1]).tolist(),'folds':fold_scores,'feature_importance':sorted([{'feature':f,'value':round(float(v),4)} for f,v in zip(features,importance)],key=lambda x:-x['value']),'evaluation':'5-fold StratifiedGroupKFold, dipisah berdasarkan peserta; preprocessing dipelajari hanya dari fold pelatihan.','dataset':'CSV impor' if import_frame is not None else 'ETDD70 v2','oof':[{'subject_id':str(row['subject_id']),'task':str(row.get('task','import')),'label':int(row['label']),'prediction':int(predictions[i]),'probability':round(float(probabilities[i]),4)} for i,(_,row) in enumerate(frame.iterrows())]}
    dest=output_dir or MODELS;dest.mkdir(parents=True,exist_ok=True);joblib.dump(model,dest/(report['id']+'.joblib'));(dest/(report['id']+'.json')).write_text(json.dumps(report,indent=2));return report

if __name__=='__main__':
    r=train();print(json.dumps({k:v for k,v in r.items() if k not in ['oof','feature_importance']},indent=2))